// components/exercises/exercise-form.jsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Camera, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

export default function ExerciseForm({ exercise, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    title: exercise?.title || '',
    description: exercise?.description || '',
    type: exercise?.type || 'meditation',
    difficulty: exercise?.difficulty || 'beginner',
    duration: exercise?.duration || 5,
    mediaUrl: exercise?.mediaUrl || '',
    thumbnailUrl: exercise?.thumbnailUrl || '',
    instructions: exercise?.instructions || [''],
    benefits: exercise?.benefits || [''],
    isPublished: exercise?.isPublished !== false,
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = e => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayItemChange = (field, index, value) => {
    setFormData(prev => {
      const newArray = [...prev[field]];
      newArray[index] = value;
      return { ...prev, [field]: newArray };
    });
  };

  const addArrayItem = field => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], ''],
    }));
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => {
      const newArray = [...prev[field]];
      newArray.splice(index, 1);
      return { ...prev, [field]: newArray.length ? newArray : [''] };
    });
  };

  const handleSubmit = async e => {
    e.preventDefault();

    setIsLoading(true);
    try {
      await onSave(formData);
      toast.success(
        exercise
          ? 'Exercise updated successfully'
          : 'Exercise created successfully'
      );
    } catch (error) {
      console.error('Error saving exercise:', error);
      toast.error('Failed to save exercise');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="title">Exercise Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="e.g., Mindful Breathing"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Exercise Type *</Label>
          <Select
            value={formData.type}
            onValueChange={value => handleSelectChange('type', value)}
          >
            <SelectTrigger id="type">
              <SelectValue placeholder="Select Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="breathing">Breathing</SelectItem>
              <SelectItem value="meditation">Meditation</SelectItem>
              <SelectItem value="mindfulness">Mindfulness</SelectItem>
              <SelectItem value="relaxation">Relaxation</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="difficulty">Difficulty Level *</Label>
          <Select
            value={formData.difficulty}
            onValueChange={value => handleSelectChange('difficulty', value)}
          >
            <SelectTrigger id="difficulty">
              <SelectValue placeholder="Select Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Duration (minutes) *</Label>
          <Input
            id="duration"
            type="number"
            min="1"
            max="120"
            value={formData.duration}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Describe this exercise and its benefits..."
          rows={3}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Instructions *</Label>
        {formData.instructions.map((instruction, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              value={instruction}
              onChange={e =>
                handleArrayItemChange('instructions', index, e.target.value)
              }
              placeholder={`Step ${index + 1}`}
              required
            />
            {formData.instructions.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeArrayItem('instructions', index)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => addArrayItem('instructions')}
        >
          <Plus className="h-4 w-4 mr-2" /> Add Step
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Benefits *</Label>
        {formData.benefits.map((benefit, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              value={benefit}
              onChange={e =>
                handleArrayItemChange('benefits', index, e.target.value)
              }
              placeholder={`Benefit ${index + 1}`}
              required
            />
            {formData.benefits.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeArrayItem('benefits', index)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => addArrayItem('benefits')}
        >
          <Plus className="h-4 w-4 mr-2" /> Add Benefit
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="mediaUrl">Media URL (YouTube or MP4)</Label>
        <Input
          id="mediaUrl"
          value={formData.mediaUrl}
          onChange={handleInputChange}
          placeholder="https://..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
        <Input
          id="thumbnailUrl"
          value={formData.thumbnailUrl}
          onChange={handleInputChange}
          placeholder="https://..."
        />
      </div>

      <div className="space-y-2">
        <Label>Publish Status</Label>
        <RadioGroup
          defaultValue={formData.isPublished ? 'published' : 'draft'}
          onValueChange={value =>
            setFormData(prev => ({
              ...prev,
              isPublished: value === 'published',
            }))
          }
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="published" id="published" />
            <Label htmlFor="published">Published</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="draft" id="draft" />
            <Label htmlFor="draft">Draft</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? 'Saving...'
            : exercise
              ? 'Save Changes'
              : 'Create Exercise'}
        </Button>
      </div>
    </form>
  );
}
